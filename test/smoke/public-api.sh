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

# create a unique temp directory in /tmp
WORK_DIR="$(mktemp -d)"
COOKIE_JAR="${WORK_DIR}/cookies.txt"
BODY_FILE="${WORK_DIR}/body.txt"
HEADERS_FILE="${WORK_DIR}/headers.txt"

# trap the bash-internal event EXIT (fires when the shell is about to exit), 
# and run the specified action (clean resources)
trap 'rm -rf "$WORK_DIR"' EXIT

USERNAME="smoke_${RUN_ID}"
EMAIL="smoke_${RUN_ID}@example.test"
PASSWORD="SmokeTest!${RUN_ID}Aa1"

BOARD_NAME="Smoke Board ${RUN_ID}"
BOARD_NAME_UPDATED="Smoke Board ${RUN_ID} (updated)"

FAILED_STEPS=0
CURRENT_STEP=0

API_KEY_A="smoke_a_${RUN_ID}"
PLAINTEXT_KEY_A=""

API_KEY_B="smoke_b_${RUN_ID}"
PLAINTEXT_KEY_B=""

ORG_ID=""
BOARD_ID=""
LIST_ID=""
CARD_ID=""

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
# $2 is the destination variable of the plaintext key global variable
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
	local dest_var
	local body
	local plaintext_key

	name="$1"
	dest_var="$2"
	body="$(jq -nc --arg name "$name" '{name: $name}')"
	send_request POST /api/v1/api-keys "$body"
	assert_status 201 "POST /api/v1/api-keys creates the api key '$name'" || finish
	plaintext_key="$(get_json_value "$HTTP_BODY" '.plaintextKey')"
	assert_json "the plaintext key exists and has the expected format" '.plaintextKey | test("^tfk_[A-Za-z0-9_-]{43}$")'
	printf -v "$dest_var" '%s' "$plaintext_key"
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
				--arg a "$API_KEY_A" --arg b "$API_KEY_B"
}

verify_dependencies

rm -f "$COOKIE_JAR"

section "Session authentication"
test_register
test_login
test_create_key "$API_KEY_A" PLAINTEXT_KEY_A
test_create_key "$API_KEY_B" PLAINTEXT_KEY_B
test_list_keys
