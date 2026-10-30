import axios from 'axios'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const analyzeMessage = (text) => axios.post(`${BASE}/analyze`, { text })
export const analyzeScreenshot = (image_base64) => axios.post(`${BASE}/analyze/image`, { image_base64 })
export const getAnalyses = () => axios.get(`${BASE}/analyses`)
export const getAnalysisStats = () => axios.get(`${BASE}/analyses/stats`)
export const createCampaign = (data) => axios.post(`${BASE}/campaigns`, data)
export const getCampaigns = () => axios.get(`${BASE}/campaigns`)
export const getCampaign = (id) => axios.get(`${BASE}/campaigns/${id}`)
export const deleteCampaign = (id) => axios.delete(`${BASE}/campaigns/${id}`)
export const recordAction = (target_id, action) =>
  axios.post(`${BASE}/campaigns/action`, { target_id, action })
export const getFeedback = (campaign_id, target_id) =>
  axios.post(`${BASE}/campaigns/${campaign_id}/feedback/${target_id}`)
export const autoSimulate = (campaign_id, difficulty) =>
  axios.post(`${BASE}/campaigns/${campaign_id}/auto_simulate`, { difficulty })
export const getQuiz = (n = 6, topic = 'all') => axios.get(`${BASE}/quiz?n=${n}&topic=${topic}`)
