import ResoluteOauthController from "../controllers/resolute_oauth";

export default async function ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}) {
	return {
		text: `:wave: Hey there, thanks for installing Resolute for Slack!

Just one more step: click that button to connect your Resolute account to Slack.`,
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `:wave: Hey there, thanks for installing Resolute for Slack!

Just one more step: click that button to connect your Resolute account to Slack.`,
				},
				accessory: {
					type: "button",
					text: {
						type: "plain_text",
						text: "Connect to Resolute",
					},
					action_id: "connect",
					style: "primary",
					url: await ResoluteOauthController.generateAuthUrl({
						userId,
						teamId,
					}),
				},
			},
		],
	};
}
