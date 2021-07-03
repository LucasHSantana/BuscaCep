import axios from 'axios'
import { BUSCACEP_ENDPOINT_DEV } from '@env'

const api = axios.create({
    baseURL: BUSCACEP_ENDPOINT_DEV
})

console.log(BUSCACEP_ENDPOINT_DEV)

export default api