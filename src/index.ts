import { App } from "@slack/bolt";
import { PrismaClient } from "@prisma/client";

import AddShorcutController from "./controllers/add_shortcut";
import SlackOauthController from "./controllers/slack_oauth";
import ResoluteOauthController from "./controllers/resolute_oauth";
import InstallationStoreController from "./controllers/installation_store";
import ResoluteCommandController from "./controllers/resolute_command";

const prisma = new PrismaClient();

const installationStore = new InstallationStoreController({ prisma });

const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	clientId: process.env.SLACK_CLIENT_ID,
	clientSecret: process.env.SLACK_CLIENT_SECRET,
	stateSecret: process.env.JWT_SECRET,
	scopes: ["chat:write", "commands", "users:read"],
	installerOptions: {
		callbackOptions: {
			success: (...args) => {
				new SlackOauthController({ app, prisma }).success(...args);
			},
		},
	},
	installationStore: installationStore,
	customRoutes: [
		{
			method: "GET",
			path: "/resolute/oauth_redirect",
			handler: (...args) => {
				new ResoluteOauthController({ app, prisma }).code(...args);
			},
		},
	],
});

const addShortcutController = new AddShorcutController({ app, prisma });
const resoluteCommandController = new ResoluteCommandController({
	app,
	prisma,
});

app.shortcut(
	"add",
	addShortcutController.addShortcut.bind(addShortcutController)
);
app.command(
	"/resolute",
	resoluteCommandController.resoluteCommand.bind(resoluteCommandController)
);

// Make auth buttons actually work
app.action("connect", async ({ ack }) => {
	await ack();
});

(async () => {
	await app.start(parseInt(process.env.PORT!) || 3000);

	console.log("App started!");
})();
