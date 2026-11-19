export	class	AppError	extends	Error 
{
	readonly	statusCode: number;
	readonly	code: string;
	readonly	headers: Record<string, string>;

	constructor(message: string, statusCode: number, 
				code: string, headers: Record<string, string> = {}) 
	{
		super(message);
		this.name = "AppError";
		this.statusCode = statusCode;
		this.code = code;
		this.headers = headers;
	}
}
