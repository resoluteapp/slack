import { PrismaClient } from "@prisma/client";
import { App } from "@slack/bolt";

export default abstract class BaseController {
	app?: App;
	prisma?: PrismaClient;

	constructor({ app, prisma }: { app?: App; prisma?: PrismaClient }) {
		this.app = app;
		this.prisma = prisma;
	}
}
