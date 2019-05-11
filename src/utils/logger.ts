import winston, { format } from "winston";
const colorizer = winston.format.colorize();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" })
  ]
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: format.combine(
        format.timestamp(),
        format.simple(),
        format.printf(
          (info): string =>
            `${colorizer.colorize(
              info.level,
              `${info.timestamp} - ${info.level}: `
            )}${info.message}`
        )
      )
    })
  );
}

export default logger;
