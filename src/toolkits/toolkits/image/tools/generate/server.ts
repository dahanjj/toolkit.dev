import { type baseGenerateTool } from "./base";
import type { ServerToolConfig } from "@/toolkits/types";
import { put } from "@vercel/blob";
import { api } from "@/trpc/server";
import type { imageParameters } from "../../base";
import type z from "zod";
import { generateImage } from "@/ai/image/generate";

export const generateToolConfigServer = (
  parameters: z.infer<typeof imageParameters>,
): ServerToolConfig<
  typeof baseGenerateTool.inputSchema.shape,
  typeof baseGenerateTool.outputSchema.shape
> => {
  return {
    callback: async ({ prompt }) => {
      const image = await generateImage(parameters.model, prompt);

      if (!image) {
        console.error("No image generated");
        throw new Error("No image generated");
      }

      const imageId = crypto.randomUUID();

      const file = new File(
        [image.uint8Array],
        `images/${imageId}.${image.mimeType.split("/")[1]}`,
        {
          type: image.mimeType,
        },
      );

      const { url: imageUrl } = await put(file.name, file, {
        access: "public",
      });

      await api.images.createImage({
        url: imageUrl,
        contentType: image.mimeType,
      });

      return { url: imageUrl };
    },
  };
};
