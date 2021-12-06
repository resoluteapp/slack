import { SignJWT } from "jose";

export async function generateAuthUrl(userId: string, teamId: string) {
	const jwt = await new SignJWT({
		userId,
		teamId,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("1h")
		.sign(Buffer.from(process.env.JWT_SECRET!, "hex"));

	return `https://useresolute.com/api/oauth/authorize?client_id=${process.env.RESOLUTE_CLIENT_ID}&scope=reminders:view,reminders:create,user:email&state=${jwt}`;
}
