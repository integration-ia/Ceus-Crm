export type UploadedImageResponseBody = {
  result: {
    id: string;
    metadata: {
      key: string;
    };
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
    draft: boolean;
  };
  success: boolean;
  errors: string[];
  messages: string[];
};
