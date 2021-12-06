import { App, MessageShortcut } from "@slack/bolt";
import { prisma } from "..";
import { generateAuthUrl } from "../resoluteOauth";
import axios from "axios";

export default (app: App) => {
	app.shortcut("add", async ({ ack, client, ...args }) => {
		const shortcut = args.shortcut as MessageShortcut;

		await ack();

		const user = await prisma.user.findUnique({
			where: {
				slackId_teamId: {
					slackId: shortcut.user.id,
					teamId: shortcut.team!.id,
				},
			},
		});

		if (!user) {
			await client.views.open({
				trigger_id: shortcut.trigger_id,
				view: {
					type: "modal",
					title: {
						type: "plain_text",
						text: "Add to Resolute",
					},
					blocks: [
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: ":wave: Hey there! Please take a second to connect your Resolute account to Slack—I'll automatically save that message once you're finished.",
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
									shortcut.user.id,
									shortcut.team!.id,
									{
										reminder: shortcut.message.text,
									}
								),
							},
						},
					],
				},
			});
			return;
		}

		console.log("hmm");

		await axios.post(
			"https://useresolute.com/api/reminders",
			{
				title: shortcut.message.text,
			},
			{
				headers: {
					Authorization: `Bearer ${user.resoluteToken}`,
				},
			}
		);
	});
};
