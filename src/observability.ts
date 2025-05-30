import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource, resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_SERVICE_INSTANCE_ID, ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { trace, metrics, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';


const OTEL_COLLECTOR_HOST = process.env.OTEL_COLLECTOR_HOST || 'localhost';
const OTEL_COLLECTOR_PORT_HTTP = process.env.OTEL_COLLECTOR_PORT_HTTP || '4318';


const OTEL_COLLECTOR_URL_TRACES = `http://${OTEL_COLLECTOR_HOST}:${OTEL_COLLECTOR_PORT_HTTP}/v1/traces`;
const OTEL_COLLECTOR_URL_METRICS = `http://${OTEL_COLLECTOR_HOST}:${OTEL_COLLECTOR_PORT_HTTP}/v1/metrics`;
const OTEL_COLLECTOR_URL_LOGS = `http://${OTEL_COLLECTOR_HOST}:${OTEL_COLLECTOR_PORT_HTTP}/v1/logs`;

/**
 * Retrieves the service version from package.json.
 * @returns {string} The service version or '1.0.0' if not found.
 */
const getServiceVersion = (): string => {
  try {
    return require('../../package.json').version;
  } catch {
    return '1.0.0';
  }
};


const sdk = new NodeSDK({

  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'reflective-api-gateway',
    [ATTR_SERVICE_VERSION]: getServiceVersion(),
    [ATTR_SERVICE_INSTANCE_ID]: process.env.HOSTNAME || process.env.INSTANCE_ID || `instance-${Date.now()}`,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || 'development',
  }),


  traceExporter: new OTLPTraceExporter({
    url: OTEL_COLLECTOR_URL_TRACES,
    headers: {},
  }),


  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: OTEL_COLLECTOR_URL_METRICS,
      headers: {},
    }),

    exportIntervalMillis: parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || '5000'),
  }),

  logRecordProcessor: new SimpleLogRecordProcessor(
    new OTLPLogExporter({
      url: OTEL_COLLECTOR_URL_LOGS,
      headers: {},
    })
  ),


  instrumentations: [

    new ExpressInstrumentation({
      requestHook: (span, requestInfo) => {

        if (requestInfo.request?.body) {
          span.setAttribute('http.request.body_size', JSON.stringify(requestInfo.request.body).length);
        }

        if (requestInfo.route && typeof requestInfo.route === 'object' && 'path' in requestInfo.route) {
          span.setAttribute('http.route', (requestInfo.route as any).path);
        }
      },
    }),

    new HttpInstrumentation({
      requestHook: (span, request) => {

        let headers: any = {};
        if ('headers' in request && request.headers) {
          headers = request.headers;
        } else if ('getHeaders' in request) {
          headers = (request as any).getHeaders();
        }
        span.setAttribute('http.user_agent', headers['user-agent'] || 'unknown');
      },
      responseHook: (span, response) => {

        if (response.statusCode && response.statusCode >= 400) {
          span.recordException(new Error(`HTTP ${response.statusCode}`));
          span.setStatus({ code: SpanStatusCode.ERROR });
        }
      },
    }),

    new PinoInstrumentation({
      logHook: (span, record, level) => {

        record.traceId = span.spanContext().traceId;
        record.spanId = span.spanContext().spanId;
        record.traceFlags = span.spanContext().traceFlags;
      },
    }),

    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false
      },
      '@opentelemetry/instrumentation-express': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-http': {
        enabled: false
      },
    }),
  ],
});

// sdk.start(); // This line was causing the OpenTelemetry connection attempts, so it's commented out.

const tracer = trace.getTracer('reflective-api-gateway', getServiceVersion());
const meter = metrics.getMeter('reflective-api-gateway', getServiceVersion());

const apiGatewayRequests = meter.createCounter('api_gateway_requests_total', {
  description: 'Total number of API Gateway requests',
});

const apiGatewayRequestDuration = meter.createHistogram('api_gateway_request_duration', {
  description: 'Duration of API Gateway requests in milliseconds',
  unit: 'ms',
});

/**
 * Records an API Gateway operation metric.
 * @param {string} route The API route being accessed.
 * @param {number} duration The duration of the request in milliseconds.
 */
export const recordApiGatewayOperation = (route: string, duration?: number) => {
  const attributes = { route };

  apiGatewayRequests.add(1, attributes);

  if (duration !== undefined) {
    apiGatewayRequestDuration.record(duration, attributes);
  }
};

// The original shutdown function and its listeners are commented out
// because the SDK is not started.
// const shutdown = async () => {
//   try {
//     await sdk.shutdown();
//     console.log('OpenTelemetry SDK shut down successfully');
//   } catch (error) {
//     console.error('Error shutting down OpenTelemetry SDK:', error);
//   }
// };

// process.on('SIGTERM', async () => {
//   await shutdown();
//   process.exit(0);
// });

// process.on('SIGINT', async () => {
//   await shutdown();
//   process.exit(0);
// });

process.on('unhandledRejection', (reason, promise) => {
  // OpenTelemetry specific code related to tracing is commented out here
  // const span = tracer.startSpan('unhandled_rejection');
  // span.recordException(reason as Error);
  // span.setStatus({ code: SpanStatusCode.ERROR });
  // span.end();
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  // OpenTelemetry specific code related to tracing is commented out here
  // const span = tracer.startSpan('uncaught_exception');
  // span.recordException(error);
  // span.setStatus({ code: SpanStatusCode.ERROR });
  // span.end();
  console.error('Uncaught Exception:', error);
  // The shutdown call is commented out as SDK is not started
  // shutdown().finally(() => process.exit(1));
  process.exit(1); // Exit process directly if no graceful OTEL shutdown is needed
});

// This log was misleading if OTEL is not active, so it's commented out.
// console.log('OpenTelemetry SDK initialized successfully for API Gateway');

export { tracer, meter, sdk }