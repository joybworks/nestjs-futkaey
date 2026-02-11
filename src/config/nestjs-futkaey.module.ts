import { DynamicModule, Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ClsContextProvider } from '../context/cls-context.provider';
import { IContextProvider } from '../context/context.interface';
import { ContextMiddleware } from '../context/context.middleware';
import { NoopContextProvider } from '../context/noop-context.provider';
import { isRegularMode, setModuleOptions } from './nestjs-futkaey.accessor';
import { NESTJS_FUTkaey_CONTEXT_PROVIDER, NESTJS_FUTkaey_OPTIONS } from './nestjs-futkaey.constants';
import { NestjsFutkaeyAsyncOptions, NestjsFutkaeyModuleOptions } from './nestjs-futkaey.interfaces';

@Global()
@Module({})
export class NestjsFutkaeyModule implements NestModule {
  static forRoot(options: NestjsFutkaeyModuleOptions): DynamicModule {
    setModuleOptions(options);

    const contextProvider: IContextProvider = options.tenancy.mode === 'regular'
      ? new NoopContextProvider()
      : new ClsContextProvider();

    const imports: DynamicModule[] = [];
    if (options.tenancy.mode !== 'regular') {
      try {
        const { ClsModule } = require('nestjs-cls');
        imports.push(
          ClsModule.forRoot({
            global: true,
            middleware: { mount: true, generateId: true },
          })
        );
      } catch {
        throw new Error(
          'nestjs-cls is required for multi-tenant or custom-hierarchy mode. ' +
          'Please install it: npm install nestjs-cls'
        );
      }
    }

    return {
      module: NestjsFutkaeyModule,
      imports,
      providers: [
        {
          provide: NESTJS_FUTkaey_OPTIONS,
          useValue: options,
        },
        {
          provide: NESTJS_FUTkaey_CONTEXT_PROVIDER,
          useValue: contextProvider,
        },
        ContextMiddleware,
      ],
      exports: [
        NESTJS_FUTkaey_OPTIONS,
        NESTJS_FUTkaey_CONTEXT_PROVIDER,
      ],
    };
  }

  static forRootAsync(asyncOptions: NestjsFutkaeyAsyncOptions): DynamicModule {
    return {
      module: NestjsFutkaeyModule,
      imports: (asyncOptions.imports ?? []) as DynamicModule[],
      providers: [
        {
          provide: NESTJS_FUTkaey_OPTIONS,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          useFactory: async (...args: any[]) => {
            const options = await asyncOptions.useFactory(...args);
            setModuleOptions(options);
            return options;
          },
          inject: (asyncOptions.inject ?? []) as import('@nestjs/common').InjectionToken[],
        },
        {
          provide: NESTJS_FUTkaey_CONTEXT_PROVIDER,
          useFactory: (options: NestjsFutkaeyModuleOptions): IContextProvider => {
            return options.tenancy.mode === 'regular'
              ? new NoopContextProvider()
              : new ClsContextProvider();
          },
          inject: [NESTJS_FUTkaey_OPTIONS],
        },
        ContextMiddleware,
      ],
      exports: [
        NESTJS_FUTkaey_OPTIONS,
        NESTJS_FUTkaey_CONTEXT_PROVIDER,
      ],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    if (!isRegularMode()) {
      consumer.apply(ContextMiddleware).forRoutes('*');
    }
  }
}
