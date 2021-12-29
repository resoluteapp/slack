import { App, ExpressReceiver } from "@slack/bolt";
import { PrismaClient } from "@prisma/client";

import AddShorcutController from "./controllers/add_shortcut";
import SlackOauthController from "./controllers/slack_oauth";
import ResoluteOauthController from "./controllers/resolute_oauth";
import InstallationStoreController from "./controllers/installation_store";
import ResoluteCommandController from "./controllers/resolute_command";

const prisma = new PrismaClient();

const installationStore = new InstallationStoreController({ prisma });

const receiver = new ExpressReceiver({
	signingSecret: process.env.SLACK_SIGNING_SECRET!,
	clientId: process.env.SLACK_CLIENT_ID,
	clientSecret: process.env.SLACK_CLIENT_SECRET,
	installerOptions: {
		callbackOptions: {
			success: (...args) => {
				new SlackOauthController({ app, prisma }).success(...args);
			},
		},
	},
	installationStore: installationStore,
	stateSecret: process.env.JWT_SECRET,
	scopes: ["chat:write", "commands", "users:read"],
});

receiver.app.get("/resolute/oauth_redirect", (req, res) => {
	new ResoluteOauthController({ app, prisma }).code(req, res);
});

receiver.app.get("/install", async (req, res) => {
	res.redirect(
		await receiver.installer!.generateInstallUrl({
			scopes: ["chat:write", "commands", "users:read"],
		})
	);
});

const app = new App({
	receiver,
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
