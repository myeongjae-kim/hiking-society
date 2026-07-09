import { lazy } from '@/lib/utils/lazy';
import { ApplicationContext } from 'inversify-typesafe-spring-like';
import { beanConfig } from './BeanConfig.server';

export const applicationContext = lazy(() => ApplicationContext(beanConfig));
