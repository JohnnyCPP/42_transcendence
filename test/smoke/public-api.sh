#!/usr/bin/env bash

# public-api.sh:
#
# end-to-end smoke test of the public api
#
# exercises:
#
# - registration + login (session)
# - api key lifecycle (create, list, use, revoke)
# - public api:
#     - boards (GET, POST, PUT, DELETE)
#     - lists (POST DELETE)
#     - cards (POST DELETE)
# - authentication failure after revocation (401)
# - rate limiting (429) with Retry-After header
#
# requires:
#
# - curl
# - jq
#
# expects environment variables:
#
# BASE_URL
#            - default https://localhost
#            - address of the backend instance
# RUN_ID
#            - default <epoch>-<random>
#            - ensures unique usernames
# PUBLIC_API_RATE_LIMIT_RPM
#            - default 60
#            - requests allowed per api key within one window
# INSECURE_TLS
#            - default true
#            - pass --insecure to curl
#
# returns:
#
# - 0 if all tests pass
# - 1 if any test fails

# treat use of an unset variable as an error
set -u

# if any command in a pipeline fails, the whole pipeline fails
set -o pipefail

source "$(dirname "$0")/test-lib.sh"

DEPENDENCIES=(curl jq)

# #######
# COOKIES
# #######

# create a unique temp directory in /tmp
WORK_DIR="$(mktemp -d)"
COOKIE_JAR="${WORK_DIR}/cookies.txt"
BODY_FILE="${WORK_DIR}/body.txt"
HEADERS_FILE="${WORK_DIR}/headers.txt"

# trap the bash-internal event EXIT (fires when the shell is about to exit), 
# and run the specified action (clean resources)
trap 'rm -rf "$WORK_DIR"' EXIT

# ########
# API KEYS
# ########

API_KEY_ID_A=""
API_KEY_NAME_A="smoke_a_${RUN_ID}"
PLAINTEXT_KEY_A=""

API_KEY_ID_B=""
API_KEY_NAME_B="smoke_b_${RUN_ID}"
PLAINTEXT_KEY_B=""

# #########
# TEST DATA
# #########

USERNAME="smoke_${RUN_ID}"
EMAIL="smoke_${RUN_ID}@example.test"
PASSWORD="SmokeTest!${RUN_ID}Aa1"

ORGANIZATION_ID=""
ORGANIZATION_NAME="Smoke Organization ${RUN_ID}"
ORGANIZATION_SLUG="Smoke Slug ${RUN_ID}"

BOARD_ID=""
BOARD_NAME="Smoke Board ${RUN_ID}"
BOARD_NAME_2="Smoke Board 2 ${RUN_ID}"
BOARD_NAME_UPDATED="Smoke Board ${RUN_ID} (updated)"
BOARD_DESCRIPTION="created during a smoke test"

LIST_ID=""
LIST_NAME="Smoke List ${RUN_ID}"

CARD_ID=""
CARD_TITLE="Smoke Card ${RUN_ID}"
CARD_DESCRIPTION="created during a smoke test"
CARD_DUE_DATE="1973-12-31T14:24:24Z"

# register a test user
#
# no parameters
#
# no return value (if the test fails, terminates the script)
#
# afterwards COOKIE_JAR holds a valid session cookie
#
# it terminates execution if the register fails, 
# because future tests depend on it
#
test_register()
{
	local body

	body="$(jq -nc --arg username "$USERNAME" \
					--arg email "$EMAIL" \
					--arg password "$PASSWORD" \
					'{username: $username, email: $email, password: $password}')"
	send_request POST /api/v1/register "$body"
	assert_status 200 "POST /api/v1/register registers the test user" \
						"is the stack up at $BASE_URL? a 429 means the registration limit was hit, restart the fastify container" || finish
	assert_json "registration opens a session" '.status == "authenticated"'
}

# login a test user
#
# no parameters
#
# no return value (if the test fails, terminates the script)
#
# afterwards COOKIE_JAR holds a valid session cookie
#
# it terminates execution if the login fails, 
# because future tests depend on it
#
test_login()
{
	local body

	body="$(jq -nc --arg username "$USERNAME" \
	               --arg password "$PASSWORD" \
	               '{username: $username, password: $password}')"
	send_request POST /api/v1/login "$body"
	assert_status 200 "POST /api/v1/login logs the test user in" || finish
	assert_json "login opens a session" '.status == "authenticated"'
}

# create a new api key
#
# parameters:
#
# $1 is the name of the api key
# $2 is the destination variable of the plaintext key
# $3 is the destination variable of the api key id
#
# no return value (if the test fails, terminates the script)
#
# afterwards X-API-Key header holds a valid api key
#
# it terminates execution if the creation fails, 
# because future tests depend on it
#
test_create_key()
{
	local name
	local dest_var_plaintext
	local dest_var_id
	local body
	local plaintext_key
	local api_key_id

	name="$1"
	dest_var_plaintext="$2"
	dest_var_id="$3"
	if ! declare -p "$dest_var_plaintext" >/dev/null 2>&1
	then
		fail "test_create_key: destination variable '$dest_var_plaintext' is not declared"
		finish
	fi
	if ! declare -p "$dest_var_id" >/dev/null 2>&1
	then
		fail "test_create_key: destination variable '$dest_var_id' is not declared"
		finish
	fi
	body="$(jq -nc --arg name "$name" '{name: $name}')"
	send_request POST /api/v1/api-keys "$body"
	assert_status 201 "POST /api/v1/api-keys creates the api key '$name'" || finish
	assert_json "the plaintext key exists and has the expected format" \
				'.plaintextKey | test("^tfk_[A-Za-z0-9_-]{43}$")' || finish
	plaintext_key="$(get_json_value "$HTTP_BODY" '.plaintextKey')"
	if [ -z "$plaintext_key" ] || [ "$plaintext_key" = "null" ]
	then
		fail "test_create_key: extracted plaintext key is empty or null"
		finish
	fi
	api_key_id="$(get_json_value "$HTTP_BODY" '.apiKey.id')"
	if [ -z "$api_key_id" ] || [ "$api_key_id" = "null" ]
	then
		fail "test_create_key: extracted api key id is empty or null"
		finish
	fi
	printf -v "$dest_var_plaintext" '%s' "$plaintext_key"
	if [ -z "${!dest_var_plaintext:-}" ]
	then
		fail "test_create_key: failed to assign plaintext key to '$dest_var_plaintext'"
		finish
	fi
	printf -v "$dest_var_id" '%s' "$api_key_id"
	if [ -z "${!dest_var_id:-}" ]
	then
		fail "test_create_key: failed to assign api key id to '$dest_var_id'"
		finish
	fi
}

# list all api keys created by the authenticated user, newest first
#
# no parameters
#
# no return value
#
test_list_keys()
{
	send_request GET /api/v1/api-keys
	assert_status 200 "GET /api/v1/api-keys lists user api keys"
	assert_json "GET /api/v1/api-keys returns exactly two keys" 'length == 2'
	assert_json "both created api keys are returned" \
				'([.[].name] | sort) == ([$a, $b] | sort)' \
				--arg a "$API_KEY_NAME_A" --arg b "$API_KEY_NAME_B"
}

# create a new organization
#
# no parameters
#
# no return value (if the test fails, terminates the script)
#
# it terminates execution if the creation fails, 
# because future tests depend on it
#
# afterwards ORGANIZATION_ID contains the organization id
#
test_create_organization()
{
	local body

	body="$(jq -nc --arg name "$ORGANIZATION_NAME" \
					--arg slug "$ORGANIZATION_SLUG" \
					'{name: $name, slug: $slug}')"
	send_request POST /api/v1/organizations "$body"
	assert_status 201 "POST /api/v1/organizations creates the organization '$ORGANIZATION_NAME'" || finish
	assert_json "response contains an 'organization' object" \
				'has("organization") and (.organization | type == "object")' || finish
	ORGANIZATION_ID="$(get_json_value "$HTTP_BODY" '.organization.id')"
	assert_json "organization.id is a non-empty string" \
				'.organization.id | type == "string" and length > 0' || finish
	assert_json "organization.name equals the request name" \
				'.organization.name == $expected' \
				--arg expected "$ORGANIZATION_NAME" || finish
	assert_json "organization.archivedAt is null on a fresh org" \
				'.organization.archivedAt == null' || finish
	assert_json "organization.role is 'owner' for the creator" \
				'.organization.role == "owner"' || finish
}

# create a new board
#
# no parameters
#
# no return value (if the test fails, terminates the script)
#
# it terminates execution if the creation fails, 
# because future tests depend on it
#
# afterwards BOARD_ID contains the board id
#
test_create_board()
{
	local body

	body="$(jq -nc --arg organizationId "$ORGANIZATION_ID" \
					--arg name "$BOARD_NAME" \
					--arg description "$BOARD_DESCRIPTION" \
					'{organizationId: $organizationId, name: $name, description: $description}')"
	send_request POST /api/v1/public/boards "$body" "X-API-Key: $PLAINTEXT_KEY_A"
	assert_status 201 "POST /api/v1/public/boards creates the board '$BOARD_NAME'" || finish
	assert_json "response contains a 'board' object" \
				'has("board") and (.board | type == "object")' || finish
	BOARD_ID="$(get_json_value "$HTTP_BODY" '.board.id')"
	assert_json "board.id is a non-empty string" \
				'.board.id | type == "string" and length > 0' || finish
	assert_json "board.name equals the request name" \
				'.board.name == $expected' \
				--arg expected "$BOARD_NAME" || finish
	assert_json "board.archivedAt is null on a fresh board" \
				'.board.archivedAt == null' || finish
}

# get a board by ID, including its lists and cards
#
# no parameters
#
# no return value
#
test_get_board()
{
	send_request GET "/api/v1/public/boards/$BOARD_ID" "" "X-API-Key: $PLAINTEXT_KEY_A"
	assert_status 200 "GET /api/v1/public/boards/$BOARD_ID returns the board '$BOARD_NAME'"
	assert_json "response contains a 'board' object" \
				'has("board") and (.board | type == "object")' || finish
	BOARD_ID="$(get_json_value "$HTTP_BODY" '.board.id')"
	assert_json "board.lists is an empty array" \
            '.board.lists | type == "array" and length == 0' || finish
	assert_json "board.cards is an empty array" \
            '.board.cards | type == "array" and length == 0' || finish
}

# update an existing board by ID
#
# no parameters
#
# no return value
#
test_update_board()
{
	local body
	local description

	description="The description of this board has been updated during a smoke test."
	body="$(jq -nc --arg organizationId "$ORGANIZATION_ID" \
					--arg name "$BOARD_NAME" \
					--arg description "$description" \
					'{organizationId: $organizationId, name: $name, description: $description}')"
	send_request PUT "/api/v1/public/boards/$BOARD_ID" "$body" "X-API-Key: $PLAINTEXT_KEY_A"
	assert_status 200 "PUT /api/v1/public/boards/$BOARD_ID updates the description of board '$BOARD_NAME'"
	assert_json "board.description equals the request description" \
				'.board.description == $expected' \
				--arg expected "$description" || finish
}

# list boards owned by the api key, scoped to the current organization
#
# creates a second board in $ORGANIZATION_ID (not saved — only its name
# matters for the assertions), then lists boards for the organization.
#
# because the organization is scoped to RUN_ID and starts empty, the only
# boards it can contain are the ones created by this run: BOARD_NAME and
# BOARD_NAME_2.
#
# no parameters
#
# no return value
#
test_list_boards()
{
	local body

	body="$(jq -nc --arg organizationId "$ORGANIZATION_ID" \
					--arg name "$BOARD_NAME_2" \
					--arg description "$BOARD_DESCRIPTION" \
					'{organizationId: $organizationId, name: $name, description: $description}')"
	send_request POST /api/v1/public/boards "$body" "X-API-Key: $PLAINTEXT_KEY_A"
	assert_status 201 "POST /api/v1/public/boards creates the second board '$BOARD_NAME_2'" || finish
	send_request GET "/api/v1/public/boards?organizationId=$ORGANIZATION_ID&limit=50&offset=0" \
					 "" "X-API-Key: $PLAINTEXT_KEY_A"
	assert_status 200 "GET /api/v1/public/boards lists boards for the organization" || finish
	assert_json "response contains a 'boards' array" \
				'.boards | type == "array"'
	assert_json "the organization has exactly two boards" \
				'.pagination.total == 2 and (.boards | length == 2)'
	assert_json "every board belongs to the requested organization" \
				'.boards | all(.organizationId == $expected)' \
				--arg expected "$ORGANIZATION_ID"
	assert_json "every board is non-archived" \
				'.boards | all(.archivedAt == null)'
	assert_json "the first created board is listed" \
				'[.boards[].name] | index($expected) != null' \
				--arg expected "$BOARD_NAME"
	assert_json "the second created board is listed" \
				'[.boards[].name] | index($expected) != null' \
				--arg expected "$BOARD_NAME_2"
}

# create a new list in the board
#
# no parameters
#
# no return value (if the test fails, terminates the script)
#
# it terminates execution if the creation fails,
# because future tests depend on it
#
# afterwards LIST_ID contains the list id
#
test_create_list()
{
	local body

	body="$(jq -nc --arg boardId "$BOARD_ID" \
					--arg name "$LIST_NAME" \
					'{boardId: $boardId, name: $name}')"
	send_request POST /api/v1/public/lists "$body" "X-API-Key: $PLAINTEXT_KEY_A"
	assert_status 201 "POST /api/v1/public/lists creates the list '$LIST_NAME'" || finish
	assert_json "response contains a 'list' object" \
				'has("list") and (.list | type == "object")' || finish
	assert_json "list.id is a non-empty string" \
				'.list.id | type == "string" and length > 0' || finish
	assert_json "list.boardId equals the target board id" \
				'.list.boardId == $expected' \
				--arg expected "$BOARD_ID" || finish
	assert_json "list.name equals the request name" \
				'.list.name == $expected' \
				--arg expected "$LIST_NAME" || finish
	assert_json "list.archivedAt is null on a fresh list" \
				'.list.archivedAt == null' || finish
	assert_json "list.position is an integer" \
				'.list.position | type == "number" and (floor == .)' || finish
	LIST_ID="$(get_json_value "$HTTP_BODY" '.list.id')"
	if [ -z "$LIST_ID" ] || [ "$LIST_ID" = "null" ]
	then
		fail "test_create_list: failed to extract list.id"
		finish
	fi
}

# create a new card in the list
#
# no parameters
#
# no return value (if the test fails, terminates the script)
#
# it terminates execution if the creation fails,
# because future tests depend on it
#
# afterwards CARD_ID contains the card id
#
# fromdateiso8601 parses an ISO 8601 date string and returns 
# the Unix timestamp: The number of seconds since 
# 1970-01-01T00:00:00 UTC (the epoch)
#
# because the server normalizes date formats, the due dates are both 
# parsed to Unix timestamps so format differences 
# (1973-12-31T14:24:24Z vs ...24.000Z) don't fail the test
#
test_create_card()
{
	local body

	body="$(jq -nc --arg listId "$LIST_ID" \
					--arg title "$CARD_TITLE" \
					--arg description "$CARD_DESCRIPTION" \
					--arg dueDate "$CARD_DUE_DATE" \
					'{listId: $listId, title: $title, description: $description, dueDate: $dueDate}')"
	send_request POST /api/v1/public/cards "$body" "X-API-Key: $PLAINTEXT_KEY_A"
	assert_status 201 "POST /api/v1/public/cards creates the card '$CARD_TITLE'" || finish
	assert_json "response contains a 'card' object" \
				'has("card") and (.card | type == "object")' || finish
	assert_json "card.id is a non-empty string" \
				'.card.id | type == "string" and length > 0' || finish
	assert_json "card.listId equals the target list id" \
				'.card.listId == $expected' \
				--arg expected "$LIST_ID"
	assert_json "card.title equals the request title" \
				'.card.title == $expected' \
				--arg expected "$CARD_TITLE"
	assert_json "card.description equals the request description" \
				'.card.description == $expected' \
				--arg expected "$CARD_DESCRIPTION"
	assert_json "card.dueDate equals the request dueDate" \
				'(.card.dueDate | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601) == ($expected | fromdateiso8601)' \
				--arg expected "$CARD_DUE_DATE"
	assert_json "card.archivedAt is null on a fresh card" \
				'.card.archivedAt == null'
	assert_json "card.position is an integer" \
				'.card.position | type == "number" and (floor == .)'
	CARD_ID="$(get_json_value "$HTTP_BODY" '.card.id')"
	if [ -z "$CARD_ID" ] || [ "$CARD_ID" = "null" ]
	then
		fail "test_create_card: failed to extract card.id"
		finish
	fi
}

# get a board by id and verify its lists and cards
#
# no parameters
#
# no return value
#
test_get_board_contents()
{
	send_request GET "/api/v1/public/boards/$BOARD_ID" "" "X-API-Key: $PLAINTEXT_KEY_A"
	assert_status 200 "GET /api/v1/public/boards/$BOARD_ID returns the board '$BOARD_NAME'"
	assert_json "response contains a 'board' object" \
				'has("board") and (.board | type == "object")' || finish
	assert_json "board.id equals the requested board id" \
				'.board.id == $expected' \
				--arg expected "$BOARD_ID" || finish
	assert_json "board.lists is present" \
				'.board | has("lists")' || finish
	assert_json "board.lists is an array" \
				'.board.lists | type == "array"' || finish
	assert_json "board.lists contains exactly one entry" \
				'.board.lists | length == 1' || finish
	assert_json "board.lists contains the created list" \
				'.board.lists[0].id == $expected' \
				--arg expected "$LIST_ID" || finish
	assert_json "the list in board.lists equals the request name" \
				'.board.lists[0].name == $expected' \
				--arg expected "$LIST_NAME" || finish
	assert_json "board.cards is present" \
				'.board | has("cards")' || finish
	assert_json "board.cards is an array" \
				'.board.cards | type == "array"' || finish
	assert_json "board.cards contains exactly one entry" \
				'.board.cards | length == 1' || finish
	assert_json "board.cards contains the created card" \
				'.board.cards[0].id == $expected' \
				--arg expected "$CARD_ID" || finish
	assert_json "the card in board.cards belongs to our list" \
				'.board.cards[0].listId == $expected' \
				--arg expected "$LIST_ID" || finish
	assert_json "the card in board.cards equals the request title" \
				'.board.cards[0].title == $expected' \
				--arg expected "$CARD_TITLE" || finish
}

# archive a card
#
# no parameters
#
# no return value
#
# the card is identified by $CARD_ID
# after this test the card is archived on the server
#
test_delete_card()
{
	send_request DELETE "/api/v1/public/cards/$CARD_ID" "" "X-API-Key: $PLAINTEXT_KEY_A"
	assert_status 200 "DELETE /api/v1/public/cards/$CARD_ID archives the card '$CARD_TITLE'" || finish
	assert_json "response contains a 'card' object" \
				'has("card") and (.card | type == "object")'
	assert_json "card.id equals the deleted card id" \
				'.card.id == $expected' \
				--arg expected "$CARD_ID"
	assert_json "card.listId still points at the original list" \
				'.card.listId == $expected' \
				--arg expected "$LIST_ID"
	assert_json "card.title is unchanged" \
				'.card.title == $expected' \
				--arg expected "$CARD_TITLE"
	assert_json "card.archivedAt is no longer null" \
				'.card.archivedAt != null'
	assert_json "card.archivedAt is an ISO timestamp" \
				'.card.archivedAt | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T")'
}

# archive a list
#
# no parameters
#
# no return value
#
# the list is identified by $LIST_ID
# after this test the list is archived on the server
#
test_delete_list()
{
	send_request DELETE "/api/v1/public/lists/$LIST_ID" "" "X-API-Key: $PLAINTEXT_KEY_A"
	assert_status 200 "DELETE /api/v1/public/lists/$LIST_ID archives the list '$LIST_NAME'" || finish
	assert_json "response contains a 'list' object" \
				'has("list") and (.list | type == "object")'
	assert_json "list.id equals the deleted list id" \
				'.list.id == $expected' \
				--arg expected "$LIST_ID"
	assert_json "list.boardId still points at the original board" \
				'.list.boardId == $expected' \
				--arg expected "$BOARD_ID"
	assert_json "list.name is unchanged" \
				'.list.name == $expected' \
				--arg expected "$LIST_NAME"
	assert_json "list.archivedAt is no longer null" \
				'.list.archivedAt != null'
	assert_json "list.archivedAt is an ISO timestamp" \
				'.list.archivedAt | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T")'
}

# archive a board
#
# no parameters
#
# no return value
#
# the board is identified by $BOARD_ID
# after this test the board is archived on the server
#
test_delete_board()
{
	send_request DELETE "/api/v1/public/boards/$BOARD_ID" "" "X-API-Key: $PLAINTEXT_KEY_A"
	assert_status 200 "DELETE /api/v1/public/boards/$BOARD_ID archives the board '$BOARD_NAME'" || finish
	assert_json "response contains a 'board' object" \
				'has("board") and (.board | type == "object")'
	assert_json "board.id equals the deleted board id" \
				'.board.id == $expected' \
				--arg expected "$BOARD_ID"
	assert_json "board.organizationId still points at the original organization" \
				'.board.organizationId == $expected' \
				--arg expected "$ORGANIZATION_ID"
	assert_json "board.name is unchanged" \
				'.board.name == $expected' \
				--arg expected "$BOARD_NAME"
	assert_json "board.archivedAt is no longer null" \
				'.board.archivedAt != null'
	assert_json "board.archivedAt is an ISO timestamp" \
				'.board.archivedAt | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T")'
}

# revoke the api key
#
# parameters:
#
# $1 is the id of the api key to revoke
# $2 is the plaintext key, used to verify that 
#    the key stops authenticating afterwards
#
# no return value
#
test_revoke_key()
{
	local key_id
	local plaintext
	local body

	key_id="$1"
	plaintext="$2"
	send_request DELETE "/api/v1/api-keys/$key_id"
	assert_status 200 "DELETE /api/v1/api-keys/$key_id revokes the api key" || finish
	assert_json "response contains the revoked key's id" \
				'.id == $expected' \
				--arg expected "$key_id"
	assert_json "response contains a non-empty name" \
				'.name | type == "string" and length > 0'
	assert_json "response contains a non-empty prefix" \
				'.prefix | type == "string" and length > 0'
	assert_json "revokedAt is no longer null" \
				'.revokedAt != null'
	assert_json "revokedAt is an ISO timestamp" \
				'.revokedAt | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T")'
	body="$(jq -nc --arg organizationId "$ORGANIZATION_ID" \
					--arg name "should-not-be-created-${RUN_ID}" \
					'{organizationId: $organizationId, name: $name}')"
	send_request POST /api/v1/public/boards "$body" "X-API-Key: $plaintext"
	assert_status 401 "revoked api key '$key_id' is rejected on POST /api/v1/public/boards" || finish
	assert_json "rejection body reports an auth error" \
				'.error | type == "string" and length > 0'
}

# asserts the last response (in $HEADERS_FILE) includes a Retry-After
# header whose value is a non-negative integer, per RFC 7231 section 7.1.3
#
assert_retry_after()
{
	local label="$1"
	local value

	if [ ! -f "$HEADERS_FILE" ]
	then
		fail "$label" "headers file not found: $HEADERS_FILE"
		return 1
	fi
	value="$(grep -i '^retry-after:' "$HEADERS_FILE" \
				| head -n1 \
				| sed -E 's/^[Rr]etry-[Aa]fter:[[:space:]]*//; s/\r$//')"
	if [ -z "$value" ]
	then
		fail "$label" "missing Retry-After header in $HEADERS_FILE"
		return 1
	fi
	if ! printf '%s' "$value" | grep -Eq '^[0-9]+$'
	then
		fail "$label" "Retry-After is not a numeric seconds value: '$value'"
		return 1
	fi
	pass "$label (Retry-After: ${value}s)"
	return 0
}

# verify that exceeding the per-key rate limit returns 429
#
# no parameters
#
# no return value (if the test fails, terminates the script)
#
# key B is used only for this test. the limiter is scoped to apiKey.id,
# so the burst is on one endpoint to keep the counting simple, it does
# not matter which /api/v1/public/* endpoint is hit.
#
# the burst sends RATE_LIMIT + 1 requests
#
test_rate_limit()
{
	local limit
	local burst
	local i
	local got_429
	local saw_retry_after

	limit="$RATE_LIMIT"
	burst=$((limit + 1))
	got_429=0
	saw_retry_after=0
	for i in $(seq 1 "$burst")
	do
		send_request GET "/api/v1/public/boards?organizationId=$ORGANIZATION_ID&limit=50&offset=0" \
						 "" "X-API-Key: $PLAINTEXT_KEY_B"
		if [ "$HTTP_STATUS" = "429" ]
		then
			got_429=$((got_429 + 1))
			if [ "$saw_retry_after" -eq 0 ]
			then
				assert_retry_after "the first 429 carries a numeric Retry-After header"
				saw_retry_after=1
			fi
		fi
	done
	if [ "$got_429" -ge 1 ]
	then
		pass "rate limit: received $got_429 x 429 out of $burst requests (limit=$limit)"
	else
		fail "rate limit: expected at least one 429 out of $burst requests (limit=$limit)"
		finish
	fi
	assert_json "429 body uses the project's error envelope" \
				'has("error") and has("message")'
	assert_json "429 error code is RATE_LIMITED" \
				'.error == "RATE_LIMITED"'
}

verify_dependencies

rm -f "$COOKIE_JAR"

section "Session authentication"
test_register
test_login

section "API key management"
test_create_key "$API_KEY_NAME_A" PLAINTEXT_KEY_A API_KEY_ID_A
test_create_key "$API_KEY_NAME_B" PLAINTEXT_KEY_B API_KEY_ID_B
test_list_keys

section "Create organization"
test_create_organization

section "Board management"
test_create_board
test_get_board
test_update_board
test_list_boards

section "Create list and card"
test_create_list
test_create_card
test_get_board_contents

section "Delete resources"
test_delete_card
test_delete_list
test_delete_board
test_revoke_key "$API_KEY_ID_A" "$PLAINTEXT_KEY_A"

section "Rate limiting"
test_rate_limit

finish
