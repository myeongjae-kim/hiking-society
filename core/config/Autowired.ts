import { returnAutowired } from 'inversify-typesafe-spring-like';
import { Beans } from './BeanConfig';

export const { Autowired } = returnAutowired<Beans>();
