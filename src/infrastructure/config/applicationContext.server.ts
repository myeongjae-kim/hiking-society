import { ApplicationContext } from "inversify-typesafe-spring-like";
import { beanConfig } from "./BeanConfig.server";
import { lazy } from "./lazy";

export const applicationContext = lazy(() => ApplicationContext(beanConfig));
