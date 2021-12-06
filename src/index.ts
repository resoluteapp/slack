import { App } from "@slack/bolt";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import axios from "axios";
import { readFile } from "fs/promises";
import { join } from "path";

import installationStore from "./installationStore";
import addShortcut from "./shortcuts/add";
import slackOauthSuccess from "./slackOauthSuccess";

export const prisma = new PrismaClient();

export const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	clientId: process.env.SLACK_CLIENT_ID,
	clientSecret: process.env.SLACK_CLIENT_SECRET,
	stateSecret: process.env.JWT_SECRET,
	scopes: ["chat:write", "commands"],
	installerOptions: {
		callbackOptions: {
			success: slackOauthSuccess,
		},
	},
	installationStore,
	customRoutes: [
		{
			method: "GET",
			path: "/resolute/oauth_redirect",
			handler: async (req, res) => {
				const url = new URL(req.url!, "https://slack.useresolute.com");
				const code = url.searchParams.get("code");
				const state = url.searchParams.get("state");

				if (!code || !state) {
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

					await prisma.user.upsert({
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
					res.end(
						await readFile(join(__dirname, "..", "static/connectSuccess.html"))
					);
				} catch (e) {
					res.statusCode = 500;
					res.end("Something went wrong.");
				}
			},
		},
	],
});

addShortcut(app);

// Make auth buttons actually work
app.action("connect", async ({ ack }) => {
	await ack();
});

(async () => {
	await app.start(parseInt(process.env.PORT!) || 3000);

	console.log("App started!");
})();
