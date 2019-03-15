import CommandHandler from "./CommandHandler";
import BotClient from "./Discord/BotClient";

const botClient = new BotClient();
const commandHandler = new CommandHandler(botClient);

botClient.messageEventHandler = commandHandler.messageEventHandler;
