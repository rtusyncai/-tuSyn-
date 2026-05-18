
export interface YouTubeProfile {
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
  contentDetails: {
    videoId: string;
  };
}

class YouTubeService {
  private getAuthHeader(tokens: any) {
    return { 'Authorization': JSON.stringify(tokens) };
  }

  async getProfile(tokens: any): Promise<YouTubeProfile | null> {
    try {
      const response = await fetch('/api/youtube/profile', {
        headers: this.getAuthHeader(tokens)
      });
      if (!response.ok) throw new Error('Failed to fetch YouTube profile');
      return await response.json();
    } catch (error) {
      console.error('YouTube Profile Error:', error);
      return null;
    }
  }

  async getVideos(tokens: any): Promise<YouTubeVideo[]> {
    try {
      const response = await fetch('/api/youtube/videos', {
        headers: this.getAuthHeader(tokens)
      });
      if (!response.ok) throw new Error('Failed to fetch YouTube videos');
      return await response.json();
    } catch (error) {
      console.error('YouTube Videos Error:', error);
      return [];
    }
  }

  async updateVideo(tokens: any, videoId: string, title: string, description: string) {
    try {
      const response = await fetch('/api/youtube/video/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(tokens)
        },
        body: JSON.stringify({ videoId, title, description })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update video');
      }
      return await response.json();
    } catch (error) {
      console.error('YouTube Update Error:', error);
      throw error;
    }
  }

  async getAuthUrl(): Promise<string> {
    const res = await fetch('/api/auth/youtube/url');
    const { url } = await res.json();
    return url;
  }
}

export const youtubeService = new YouTubeService();
