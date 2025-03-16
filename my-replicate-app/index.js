import Replicate from 'replicate'
import dotenv from 'dotenv'
dotenv.config()

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  userAgent: 'https://www.npmjs.com/package/create-replicate'
})
const model = 'stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4'
const input = {
  prompt: 'an astronaut riding a horse on mars, hd, dramatic lighting',
  scheduler: 'K_EULER',
  num_outputs: 1,
  guidance_scale: 7.5,
  image_dimensions: '512x512',
  num_inference_steps: 50,
}

console.log('Using model: %s', model)
console.log('With input: %O', input)

console.log('Running...')
const output = await replicate.run(model, { input })
console.log('Done!', output)
