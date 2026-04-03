beforeAll(() => {
  jest.spyOn(Number.prototype, 'toLocaleString').mockImplementation(function (
    this: number,
    _locale,
    options,
  ) {
    return Intl.NumberFormat('en-US', options as Intl.NumberFormatOptions).format(this);
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});
