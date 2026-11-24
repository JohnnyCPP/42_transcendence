#!/usr/bin/env bash

# test-lib.sh:
#
# helper functions for smoke tests
#
# this is meant to be sourced, not executed

# declared here, the caller assigns them
declare -a DEPENDENCIES=()

# populated by pass()/fail(), used by finish()
# the caller never uses them
FAILED_STEPS=0
CURRENT_STEP=0

BASE_URL="${BASE_URL:-https://localhost}"
RUN_ID="${RUN_ID:-$(date +%s)-$RANDOM}"
RATE_LIMIT="${PUBLIC_API_RATE_LIMIT_RPM:-60}"
INSECURE_TLS="${INSECURE_TLS:-true}"

# declared here, the caller assigns them
# this way, each test manages its own cookies
#
# the caller should `trap 'rm $WORK_DIR' EXIT` to clean resources
# each test should clean its own resources
WORK_DIR=""
COOKIE_JAR=""
BODY_FILE=""
HEADERS_FILE=""

# the HTTP status code returned (e.g. 200, 404, 429)
HTTP_STATUS=""
# the raw response body
HTTP_BODY=""
# the raw response headers
HTTP_HEADERS=""

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

# print the title of a group of steps
#
# parameters:
#
# $1 is the title
#
# no return value
#
section()
{
	printf '\n== %s ==\n' "$1"
}

# print the final summary and exit
#
# exit status:
#
# 0 if no step failed, 1 otherwise
#
# no return value (terminates the script)
#
finish()
{
	printf '\n'
	if [ "$FAILED_STEPS" -eq 0 ]
	then
		printf 'RESULT: PASS (%d steps)\n' "$CURRENT_STEP"
		exit 0
	fi
	printf 'RESULT: FAIL (%d of %d steps failed)\n' "$FAILED_STEPS" "$CURRENT_STEP" >&2
	exit 1
}

# hide api keys before text is printed (logs can end up in CI output)
#
# parameters:
#
# $1  text to sanitize
#
# writes the sanitized text to stdout
#
# no return value
#
redact()
{
	printf '%s' "$1" | sed -E 's/tfk_[A-Za-z0-9_-]+/tfk_<redacted>/g'
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

# extract a response header of the last request
#
# parameters:
#
# $1  header name, case insensitive (e.g. Retry-After)
#
# writes the header value to stdout (empty string if missing)
#
# no return value
#
get_header()
{
	printf '%s' "$HTTP_HEADERS" | tr -d '\r' | grep -i "^$1:" | head -n 1 | cut -d: -f2- | tr -d ' '
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
	local message

	if [ "$HTTP_STATUS" = "$expected" ]
	then
		pass "$label"
		return 0
	fi
	message="expected HTTP $expected, got $HTTP_STATUS. Body: $(redact \"$HTTP_BODY\")"
	if [ -n "$hint" ]
	then
		message="$message ($hint)"
	fi
	fail "$label" "$message"
	return 1
}

# assert that the JSON body of the last response satisfies a jq expression
#
# parameters:
#
# $1    label for PASS/FAIL
# $2    jq filter that must evaluate to true (e.g. '.board.id == $id')
# $3..  optional extra jq arguments, typically --arg name value
#
# return value:
#
# 0  if the filter evaluates to true (jq -e exits with 0)
# 1  otherwise (and records a failed step)
#
assert_json()
{
	local label="$1"
	local filter="$2"

	shift 2
	if printf '%s' "$HTTP_BODY" | jq -e "$@" "$filter" >/dev/null 2>&1
	then
		pass "$label"
		return 0
	fi
	fail "$label" "JSON check failed: $filter. Body: $(redact "$HTTP_BODY")"
	return 1
}

# stop the run if a value that later steps depend on is missing
#
# parameters:
#
# $1  what the value is  (e.g. "board id")
# $2  the value
# $3  optional hint
#
# no return value (terminates the script when the value is empty)
#
is_empty()
{
	local key="$1"
	local value="$2"
	local hint="${3:-}"

	if [ -n "$value" ]; then
		return 0
	fi
	fail "missing $key, the next steps depend on it" "$hint"
	finish
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
# no return value (caller inspects HTTP_STATUS / HTTP_BODY / HTTP_HEADERS)
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
# Non-numeric values of HTTP_STATUS are normalized to 0 
# so comparisons are safe.
#
send_request()
{
	local method="$1"
	local path="$2"
	local body="${3:-}"
	local extra_header="${4:-}"
	local args=(
		-sS
		--connect-timeout 5
		--max-time 20
		-o "$BODY_FILE"
		-D "$HEADERS_FILE"
		-w '%{http_code}'
		-X "$method"
		-b "$COOKIE_JAR"
		-c "$COOKIE_JAR"
		-H 'Content-Type: application/json'
		-H 'Accept: application/json'
	)

	if [ "$INSECURE_TLS" = "true" ]
	then
		args+=(--insecure)
	fi
	if [ -n "$extra_header" ]
	then
		args+=(-H "$extra_header")
	fi
	if [ -n "$body" ]
	then
		args+=(--data "$body")
	fi
	: > "$BODY_FILE"
	: > "$HEADERS_FILE"
	HTTP_STATUS="$(curl "${args[@]}" "${BASE_URL}${path}")"
	HTTP_BODY="$(cat "$BODY_FILE" 2>/dev/null || true)"
	HTTP_HEADERS="$(cat "$HEADERS_FILE" 2>/dev/null || true)"
	case "$HTTP_STATUS" in
		''|*[!0-9]*)
			HTTP_STATUS=0
			;;
	esac
}
