import type { TypesafeContainer } from "inversify-typesafe";
import { applicationContext } from "./applicationContext.server";
import type { UseCaseBeans } from "./BeanConfig.server";

export const applicationUseCaseContext =
	applicationContext as () => TypesafeContainer<UseCaseBeans>;
