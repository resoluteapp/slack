import { Installation, InstallURLOptions } from "@slack/bolt";
import { IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "fs/promises";
import { join } from "path";
import { app } from ".";
import { generateAuthUrl } from "./resoluteOauth";

export default async (
	installation: Installation,
	o: InstallURLOptions,
	req: IncomingMessage,
	res: ServerResponse
) => {
	await app.client.chat.postMessage({
		token: installation.bot?.token,
		text: `:wave: Hey there, thanks for installing Resolute for Slack!

Just one more step: click that button to link your Resolute account to Slack.`,
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `:wave: Hey there, thanks for installing Resolute for Slack!

Just one more step: click that button to link your Resolute account to Slack.`,
				},
				accessory: {
					type: "button",
					text: {
						type: "plain_text",
						text: "Connect to Resolute",
					},
					action_id: "connect",
					style: "primary",
					url: await generateAuthUrl(
						installation.user.id,
						installation.team!.id
					),
				},
			},
		],
		channel: installation.user.id,
	});

	res.end(await readFile(join(__dirname, "..", "static/installSuccess.html")));
};
