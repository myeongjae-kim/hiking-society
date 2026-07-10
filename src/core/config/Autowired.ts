import { returnAutowired } from "inversify-typesafe-spring-like";
import type { AutowiredBeans } from "./DependencyTokens";

export const { Autowired } = returnAutowired<AutowiredBeans>();
