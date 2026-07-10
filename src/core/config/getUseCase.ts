import { applicationContext } from "./applicationContext.server";
import type { UseCaseBeans } from "./BeanConfig.server";

export function getUseCase<TUseCaseName extends keyof UseCaseBeans>(
	useCaseName: TUseCaseName,
): UseCaseBeans[TUseCaseName] {
	return applicationContext().get(useCaseName);
}
