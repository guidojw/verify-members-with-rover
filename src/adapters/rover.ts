import type { AxiosPromise, Method } from 'axios'
import type { VerificationData } from '../extensions'
import axios from 'axios'

export default async function roVerAdapter (method: Method, pathname: string): Promise<AxiosPromise<VerificationData>> {
  return await axios({
    url: 'https://verify.eryn.io/api/' + pathname,
    method
  })
}
