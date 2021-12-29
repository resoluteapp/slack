import axios from "axios";
import { jwtVerify, SignJWT } from "jose";
import { IncomingMessage, ServerResponse } from "node:http";
import { join } from "path";
import { readFile } from "fs/promises";
import BaseController from "./base";
import { Installation } from "@slack/bolt";

export default class ResoluteOauthController extends BaseController {
	async code(req: IncomingMessage, res: ServerResponse) {
		const url = new URL(req.url!, "https://slack.useresolute.com");
		const code = url.searchParams.get("code");
		const state = url.searchParams.get("state");
		const error = url.searchParams.get("error");

		if (error !== null || !code || !state) {
			res.statusCode = 302;
			res.setHeader("Location", "/");
			res.end();
			return;
		}

		try {
			const { payload } = await jwtVerify(
				state,
				Buffer.from(process.env.JWT_SECRET!, "hex")
			);

			const slackId = payload.userId as string;
			const teamId = payload.teamId as string;

			const {
				data: { access_token },
			} = await axios.post("https://useresolute.com/api/oauth/token", {
				client_id: process.env.RESOLUTE_CLIENT_ID,
				client_secret: process.env.RESOLUTE_CLIENT_SECRET,
				grant_type: "authorization_code",
				code,
			});

			const { data: resoluteUser } = await axios(
				"https://useresolute.com/api/me",
				{
					headers: {
						Authorization: `Bearer ${access_token}`,
					},
				}
			);

			await this.prisma!.user.upsert({
				where: { slackId_teamId: { slackId, teamId } },
				create: {
					slackId,
					teamId,
					resoluteId: resoluteUser.id,
					resoluteToken: access_token,
				},
				update: {
					resoluteId: resoluteUser.id,
					resoluteToken: access_token,
				},
			});

			if (payload.reminder) {
				await axios.post(
					"https://useresolute.com/api/reminders",
					payload.reminder,
					{
						headers: {
							Authorization: `Bearer ${access_token}`,
						},
					}
				);

				const team = await this.prisma!.team.findUnique({
					where: { id: teamId },
				});
				if (team !== null) {
					const token = (team.installation as unknown as Installation).bot!
						.token;

					await this.app!.client.chat.postMessage({
						token,
						channel: slackId,
						text: `Thanks for connecting your Resolute account to Slack! I've automatically added <${
							(payload.reminder as any).url
						}|this message> for you.`,
					});
				}
			}

			res.end(
				await readFile(join(__dirname, "../views/html/connectSuccess.html"))
			);
		} catch (e) {
			res.statusCode = 500;
			res.end("Something went wrong.");
		}
	}

	static async generateAuthUrl({
		userId,
		teamId,
		data,
	}: {
		userId: string;
		teamId: string;
		data?: any;
	}) {
		const jwt = await new SignJWT({
			userId,
			teamId,
			...data,
		})
			.setProtectedHeader({ alg: "HS256" })
			.setIssuedAt()
			.setExpirationTime("1h")
			.sign(Buffer.from(process.env.JWT_SECRET!, "hex"));

		return `https://useresolute.com/api/oauth/authorize?client_id=${process.env.RESOLUTE_CLIENT_ID}&scope=reminders:view,reminders:create&state=${jwt}`;
	}
}
