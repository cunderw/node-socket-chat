// logger.test.ts
import * as logger from './logger'

describe('Logger Functions', () => {
  // Mock console methods before each test
  beforeEach(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  // Restore the original implementations after each test
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should call console.debug with the correct parameters', () => {
    const message = 'Debug message'
    const param = { key: 'value' }
    logger.debug(message, param)

    expect(console.debug).toHaveBeenCalledWith(message, param)
  })

  it('should call console.info with the correct parameters', () => {
    const message = 'Info message'
    const param1 = 'detail1'
    const param2 = 123
    logger.info(message, param1, param2)

    expect(console.info).toHaveBeenCalledWith(message, param1, param2)
  })

  it('should call console.warn with the correct parameters', () => {
    const message = 'Warning message'
    const param = ['array', 'of', 'values']
    logger.warn(message, param)

    expect(console.warn).toHaveBeenCalledWith(message, param)
  })

  it('should call console.error with the correct parameters', () => {
    const message = 'Error message'
    const param = new Error('Test error')
    logger.error(message, param)

    expect(console.error).toHaveBeenCalledWith(message, param)
  })
})
