import { Prisma } from "@prisma/client";
import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import onboardingDm from "../views/onboarding_dm";
import BaseController from "./base";

export default class ResoluteCommandController extends BaseController {
	async resoluteCommand({
		ack,
		command,
	}: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
		switch (command.text) {
			case "":
			case "connect":
				await ack(
					await onboardingDm({
						userId: command.user_id,
						teamId: command.team_id,
					})
				);
				break;
			case "disconnect":
				try {
					await this.prisma?.user.delete({
						where: {
							slackId_teamId: {
								slackId: command.user_id,
								teamId: command.team_id,
							},
						},
					});

					await ack({
						text: ":+1: I've successfully disconnected your Resolute account from Slack.\n\nYou can run `/resolute connect` at any time to re-connect!",
					});
				} catch (e) {
					if (
						e instanceof Prisma.PrismaClientKnownRequestError &&
						e.code === "P2025"
					) {
						await ack({
							text: "Looks like your Resolute account wasn't connected to begin with.\n\nYou can run `/resolute connect` at any time to connect!",
						});
					} else {
						throw e;
					}
				}
				break;
			default:
				await ack({
					text: "I'm not quite sure what you mean—try typing `/resolute connect` or `/resolute disconnect` instead.",
				});
				break;
		}
	}
}
