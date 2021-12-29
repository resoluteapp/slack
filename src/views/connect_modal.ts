import ResoluteOauthController from "../controllers/resolute_oauth";

export default async function ({
	userId,
	teamId,
	data,
}: {
	userId: string;
	teamId: string;
	data?: any;
}) {
	return [
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
				url: await ResoluteOauthController.generateAuthUrl({
					userId,
					teamId,
					data,
				}),
			},
		},
	];
}
