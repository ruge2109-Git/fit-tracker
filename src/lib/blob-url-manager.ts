/**
 * Safe Object URL Management
 * Handles creation and cleanup of blob URLs to prevent memory leaks
 */

interface BlobUrlLifecycle {
  url: string;
  blob: Blob;
  createdAt: number;
}

class BlobUrlManager {
  private urls = new Map<string, BlobUrlLifecycle>()
  private cleanupTimeouts = new Map<string, NodeJS.Timeout>()

  /**
   * Create a blob URL with automatic cleanup
   * @param blob The blob to create URL for
   * @param autoCleanupMs Auto cleanup timeout in milliseconds (default: 60s)
   * @returns The blob URL
   */
  createUrl(blob: Blob, autoCleanupMs: number = 60000): string {
    const url = URL.createObjectURL(blob)

    this.urls.set(url, {
      url,
      blob,
      createdAt: Date.now(),
    })

    // Set automatic cleanup
    const timeout = setTimeout(() => {
      this.revokeUrl(url)
    }, autoCleanupMs)

    this.cleanupTimeouts.set(url, timeout)

    return url
  }

  /**
   * Manually revoke a blob URL
   * @param url The URL to revoke
   */
  revokeUrl(url: string): void {
    const timeout = this.cleanupTimeouts.get(url)
    if (timeout) {
      clearTimeout(timeout)
      this.cleanupTimeouts.delete(url)
    }

    if (this.urls.has(url)) {
      try {
        URL.revokeObjectURL(url)
      } catch (error) {
        console.warn('Error revoking blob URL:', error)
      }
      this.urls.delete(url)
    }
  }

  /**
   * Download a blob with automatic cleanup
   * @param blob The blob to download
   * @param filename The filename for the download
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = this.createUrl(blob, 2000) // Shorter cleanup for downloads

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()

    // Cleanup after a small delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(link)
      this.revokeUrl(url)
    }, 100)
  }

  /**
   * Get stats on managed URLs
   */
  getStats() {
    return {
      totalUrls: this.urls.size,
      urls: Array.from(this.urls.values()).map((item) => ({
        url: item.url,
        blobSize: item.blob.size,
        age: Date.now() - item.createdAt,
      })),
    }
  }

  /**
   * Cleanup all managed URLs
   */
  cleanup(): void {
    this.cleanupTimeouts.forEach((timeout) => clearTimeout(timeout))
    this.cleanupTimeouts.clear()

    this.urls.forEach((_, url) => {
      try {
        URL.revokeObjectURL(url)
      } catch (error) {
        console.warn('Error revoking blob URL:', error)
      }
    })

    this.urls.clear()
  }
}

export const blobUrlManager = new BlobUrlManager()
