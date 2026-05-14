import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
  });

  it('returns the server health status', () => {
    const result = service.checkHealth();

    expect(result.message).toBe('Server is running');
    expect(result.data.status).toBe('ok');
    expect(result.data.uptime).toEqual(expect.any(Number));
    expect(result.data.timestamp).toEqual(expect.any(String));
  });
});
