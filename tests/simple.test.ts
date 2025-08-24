describe('Simple Test Suite', () => {
  test('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('should test string operations', () => {
    const greeting = 'Hello, RightHere!';
    expect(greeting).toContain('RightHere');
    expect(greeting.length).toBeGreaterThan(0);
  });
  
  test('should test array operations', () => {
    const events = ['Event 1', 'Event 2', 'Event 3'];
    expect(events).toHaveLength(3);
    expect(events).toContain('Event 2');
  });
});