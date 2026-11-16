import { createRandomToken } from "./createRandomToken.js";

const	API_KEY_PREFIX = "tfk_";

export	interface	GeneratedApiKey 
{
	// tfk_ + 43-char base64url
	plaintext: string;
	// first 10 chars of plaintext
	prefix: string;
}

export	function	generateApiKey(): GeneratedApiKey 
{
	const	plaintext = `${API_KEY_PREFIX}${createRandomToken(32)}`;
	const	prefix = plaintext.slice(0, 10);

	return {
		plaintext,
		prefix
	};
}
