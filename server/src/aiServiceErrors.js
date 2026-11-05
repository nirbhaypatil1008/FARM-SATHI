export function aiServiceUnavailableMessage(error, feature) {
  const errorCode = error?.cause?.code || error?.code
  const label = feature || 'TensorFlow AI service'

  if (error?.name === 'TimeoutError' || error?.name === 'AbortError' || errorCode === 'UND_ERR_CONNECT_TIMEOUT') {
    return `The ${label} timed out. Check that the AI service is running and try again.`
  }
  if (errorCode === 'ECONNREFUSED') {
    return `The ${label} refused the connection. Start ai-service and check AI_SERVICE_URL.`
  }
  if (errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN') {
    return `The ${label} host could not be resolved. Check AI_SERVICE_URL.`
  }
  return `The ${label} is unavailable. Check AI_SERVICE_URL and the AI-service logs.`
}
