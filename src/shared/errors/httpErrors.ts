import { AppError } from "./AppError.js";

export	function	badRequest(message = "Bad request", code = "BAD_REQUEST"): AppError
{
	return new AppError(message, 400, code);
}

export	function	unauthorized(message = "Authentication required", code = "UNAUTHORIZED"): AppError
{
	return new AppError(message, 401, code);
}

export	function	forbidden(message = "Forbidden", code = "FORBIDDEN"): AppError
{
	return new AppError(message, 403, code);
}

export	function	notFound(message = "Not found", code = "NOT_FOUND"): AppError
{
	return new AppError(message, 404, code);
}

export	function	conflict(message = "Conflict", code = "CONFLICT"): AppError
{
	return new AppError(message, 409, code);
}

export	function	tooManyRequests(message: string = "Too many requests", 
									code: string = "RATE_LIMITED", 
									retryAfterSeconds?: number): AppError
{
	let	headers: Record<string, string> = {};

	if (retryAfterSeconds !== undefined)
		headers = { "Retry-After": String(retryAfterSeconds) };
	return new AppError(
		message,
		429,
		code,
		headers
	);
}
