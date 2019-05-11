import Discord, { Guild, Message } from "discord.js";
import config from "../config";
import logger from "../utils/logger";

class BotClient extends Discord.Client {
  public messageEventHandler: (message: Message) => Promise<void>;
  public constructor(token: string = config.DISCORD_BOT_TOKEN) {
    super();

    this.token = token;

    this.on("ready", this.onReady);
    this.on("guildCreate", this.onGuildCreate);
    this.on("guildDelete", this.onGuildDelete);
    this.on("message", this.onMessage);
    this.on("error", this.onError);

    this.login(token);
  }

  // Event handlers
  public onError = (error: Error): void => {
    logger.error(
      `BOT_CLIENT: Discord bot error: ${error.name}:${error.message}.`
    );
  };

  public onReady = (): void => {
    logger.info(
      `BOT_CLIENT: Bot has started, with ${this.users.size} users, in ${
        this.channels.size
      } channels of ${this.guilds.size} guilds.`
    );
  };

  public onGuildCreate = (guild: Guild): void => {
    logger.info(
      `BOT_CLIENT: Added to guild: ${guild.name} (id: ${
        guild.id
      }). This guild has ${guild.memberCount} members.`
    );
  };

  public onGuildDelete = (guild: Guild): void => {
    logger.info(
      `BOT_CLIENT: Removed from guild: ${guild.name} (id: ${guild.id})`
    );
  };

  public onMessage = async (message: Message): Promise<void> => {
    // Ignore non-guild messages
    if (!message.guild) {
      return;
    }

    // Ignore bots
    if (message.member.user.bot) {
      return;
    }

    if (this.messageEventHandler) {
      this.messageEventHandler(message);
    }
  };
}

export default BotClient;
