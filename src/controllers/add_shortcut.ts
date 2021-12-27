import {
	AllMiddlewareArgs,
	MessageShortcut,
	SlackShortcutMiddlewareArgs,
} from "@slack/bolt";
import axios from "axios";
import connectModal from "../views/slack/connect_modal";
import BaseController from "./base";

export default class AddShortcutController extends BaseController {
	async addShortcut({
		ack,
		client,
		shortcut,
	}: SlackShortcutMiddlewareArgs<MessageShortcut> & AllMiddlewareArgs) {
		await ack();

		const slackUser = await client.users.info({
			user: shortcut.message.user!,
		});

		const { permalink: url } = await client.chat.getPermalink({
			channel: shortcut.channel.id,
			message_ts: shortcut.message.ts,
		});

		const reminder = {
			text: shortcut.message.text,
			author:
				slackUser.user?.profile?.display_name ||
				slackUser.user?.profile?.real_name,
			author_avatar: slackUser.user?.profile?.image_48,
			url,
		};

		const user = await this.prisma!.user.findUnique({
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
					blocks: await connectModal({
						userId: shortcut.user.id!,
						teamId: shortcut.team?.id!,
						data: { reminder },
					}),
				},
			});
			return;
		}

		try {
			await axios.post("https://useresolute.com/api/reminders", reminder, {
				headers: {
					Authorization: `Bearer ${user.resoluteToken}`,
				},
			});
		} catch (e) {
			await client.views.open({
				trigger_id: shortcut.trigger_id,
				view: {
					type: "modal",
					title: {
						type: "plain_text",
						text: "Add to Resolute",
					},
					blocks: await connectModal({
						userId: shortcut.user.id!,
						teamId: shortcut.team?.id!,
						data: { reminder },
					}),
				},
			});
		}
	}
}
