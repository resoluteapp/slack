import { Installation, InstallURLOptions } from "@slack/bolt";
import { IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "fs/promises";
import { join } from "path";
import ResoluteOauthController from "./resolute_oauth";
import BaseController from "./base";
import onboardingDm from "../views/slack/onboarding_dm";

export default class SlackOauthController extends BaseController {
	async success(
		installation: Installation,
		o: InstallURLOptions,
		req: IncomingMessage,
		res: ServerResponse
	) {
		await this.app!.client.chat.postMessage({
			token: installation.bot?.token,
			...(await onboardingDm({
				userId: installation.user.id,
				teamId: installation.team!.id,
			})),
			channel: installation.user.id,
		});

		res.end(
			await readFile(join(__dirname, "../views/html/installSuccess.html"))
		);
	}
}
