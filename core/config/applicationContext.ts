import { lazy } from '@/lib/utils/lazy';
import { ApplicationContext } from 'inversify-typesafe-spring-like';
import { beanConfig } from './BeanConfig';

export const applicationContext = lazy(() => ApplicationContext(beanConfig));
