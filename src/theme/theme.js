import { createSystem, defaultConfig } from "@chakra-ui/react"

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'Montserrat', sans-serif` },
        body: { value: `'Montserrat, sans-serif' ` },
        colors: {
          primary: {
            100: "#0079A5",
            200: "#0079A5",
            300: "#0079A5",
            400: "#0079A5",
            500: "#0079A5"
          }
        }
      },
    },
  },
})