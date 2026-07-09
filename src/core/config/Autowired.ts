import { returnAutowired } from "inversify-typesafe-spring-like";
import type { Beans } from "./BeanConfig.server";

export const { Autowired } = returnAutowired<Beans>();
