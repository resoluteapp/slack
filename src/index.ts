import { App } from "@slack/bolt";
import { PrismaClient } from "@prisma/client";

import installationStore from "./installationStore";
import addShortcut from "./shortcuts/add";
import slackOauthSuccess from "./slackOauthSuccess";
import * as resoluteOauth from "./resoluteOauth";

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
			handler: resoluteOauth.code,
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
