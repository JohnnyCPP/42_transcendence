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
#     - lists (DELETE)
#     - cards (POST)
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
#            - default http://127.0.0.1:3000
#            - address of the backend instance
# RUN_ID
#            - default <epoch>-<random>
#            - ensures unique usernames
# PUBLIC_API_RATE_LIMIT_RPM
#            - default 60
#            - requests allowed per api key within one window
#
# returns:
#
# - 0 if all tests pass
# - 1 if any test fails

# treat use of an unset variable as an error
set -u

# if any command in a pipeline fails, the whole pipeline fails
set -o pipefail

DEPENDENCIES=(curl jq)

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
RUN_ID="${RUN_ID:-$(date +%s)-$RANDOM}"
RATE_LIMIT="${PUBLIC_API_RATE_LIMIT_RPM:-60}"

# create a unique temp file in /tmp, assign its path to COOKIE_JAR
COOKIE_JAR="$(mktemp)"

# trap the bash-internal event EXIT (fires when the shell is about to exit), 
# and run the specified action (clean resources)
trap 'rm -f "$COOKIE_JAR" /tmp/smoke_body.$$' EXIT

# the HTTP status code returned (e.g. 200, 404, 429)
HTTP_STATUS=""
# the raw response body
HTTP_BODY=""
# the raw response headers
HTTP_HEADERS=""

USERNAME="smoke_${RUN_ID}"
EMAIL="smoke_${RUN_ID}@example.test"
PASSWORD="SmokeTest!${RUN_ID}Aa1"

FAILED_STEPS=0
CURRENT_STEP=0

API_KEY_A=""
API_KEY_A_ID=""

API_KEY_B=""
API_KEY_B_ID=""

ORG_ID=""
BOARD_ID=""
LIST_ID=""
CARD_ID=""

# declare a test as passed
#
# parameters:
#
# $1 is the name of the passed test
#
# no return value
#
pass()
{
	CURRENT_STEP=$((CURRENT_STEP + 1))
	printf 'PASS  [%02d] %s\n' "$CURRENT_STEP" "$1";
}

# declare a test as failed
#
# parameters:
#
# $1 is the name of the failed test
# $2 (optional) provides additional context of why the test failed
#
# no return value
#
fail()
{
	CURRENT_STEP=$((CURRENT_STEP + 1))
	FAILED_STEPS=$((FAILED_STEPS + 1))
	printf                     'FAIL  [%02d] %s\n' "$CURRENT_STEP" "$1" >&2
	test -n "${2:-}" && printf '             %s\n' "$2" >&2
}

# check that dependencies are present
#
# no parameters
#
# no return value
#
verify_dependencies()
{
	for tool in "${DEPENDENCIES[@]}"
	do
		echo "INFO: Verifying dependency on $tool..."
		command -v "$tool" >/dev/null 2>&1 || { echo "ERROR: '$tool' not found in PATH" >&2; exit 1; }
	done
}

# extract a value from a JSON string using a jq filter
#
# parameters:
#
# $1  the JSON string (typically "$HTTP_BODY")
# $2  jq filter       (e.g. .user.id)
#
# writes the extracted value to stdout (empty string if missing/null)
# does not fail, callers must check for emptiness
#
# no return value
#
get_json_value()
{
	printf '%s' "$1" | jq -r "$2 // empty" 2>/dev/null
}

# assert that the last response had the expected HTTP status
#
# parameters:
#
# $1  expected status      (e.g. 200)
# $2  label for PASS/FAIL  (a short description of what is being checked)
# $3  optional hint       (printed only when the assertion fails)
#
# return value:
#
# 0  if HTTP_STATUS == expected
# 1  otherwise (and records a failed step)
#
assert_status()
{
	local expected="$1"
	local label="$2"
	local hint="${3:-}"

	if [ "$HTTP_STATUS" = "$expected" ]; then
		pass "$label"
		return 0
	fi
	local message="expected HTTP $expected, got $HTTP_STATUS. Body: $HTTP_BODY"
	test -n "$hint" && message="$message ($hint)"
	fail "$label" "$message"
	return 1
}

# perform an HTTP request against the backend and capture the response
#
# parameters:
#
# $1  HTTP method        (GET, POST, PUT, DELETE, ...)
# $2  request path       (e.g. /api/v1/register)
# $3  request body       (optional, empty string for none)
# $4  extra header       (optional, e.g. "X-API-Key: tfk_...")
#
# no return value (caller inspects HTTP_STATUS / HTTP_BODY)
#
# why "curl -c/-b $COOKIE_JAR":
#
#   -c writes the cookie jar to disk after the request
#   -b reads the cookie jar before the request
#   together they make subsequent requests carry the same session cookie
#   that the register/login response set
#
# breakdown of args:
# 
#   -s: silent (no progress bar, no messages)
#   -S: show errors 
#       (together with -s means being quiet on success, loud on errors)
#   -o: redirect response body to a file
#   -D: redirect response headers to a file
#   -w: after the request completes, print the specified data to stdout. 
#       "http_code" is curl's variable for the HTTP status code.
#       the only thing on stdout is the status code, which gets assigned 
#       to HTTP_STATUS
#   -X: force http method (without it, curl defaults to GET/POST)
#   -b: read cookies from a file and send them with the request
#   -c: after the request, save "Set-Cookie" headers received into a file
#   -H: set a request header
#
# curl returns the status as a string, a failed connection yields an empty
# string or something non-numeric. 
# HTTP_STATUS is normalized to 0 so comparisons are safe.
#
send_request()
{
	local method="$1"
	local path="$2"
	local body="${3:-}"
	local extra_header="${4:-}"
	local args=(
		-sS
		-o /tmp/smoke_body.$$
		-D /tmp/smoke_headers.$$
		-w '%{http_code}'
		-X "$method"
		-b "$COOKIE_JAR"
		-c "$COOKIE_JAR"
		-H 'Content-Type: application/json'
		-H 'Accept: application/json'
	)

	test -n "$extra_header" && args+=(-H "$extra_header")
	test -n "$body" && args+=(--data "$body")
	HTTP_STATUS="$(curl "${args[@]}" "${BASE_URL}${path}")"
	HTTP_BODY="$(cat /tmp/smoke_body.$$ 2>/dev/null || true)"
	HTTP_HEADERS="$(cat /tmp/smoke_headers.$$ 2>/dev/null || true)"
	case "$HTTP_STATUS" in
		''|*[!0-9]*)
			HTTP_STATUS=0
			;;
	esac
}
