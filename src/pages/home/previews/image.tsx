import { Error, FullLoading, ImageWithError } from "~/components"
import { useRouter, useT, useLink } from "~/hooks"
import { objStore } from "~/store"
import { Obj, ObjType } from "~/types"
import { onCleanup, onMount } from "solid-js"
import { Box } from "@hope-ui/solid"
import lightGallery from "lightgallery"
import lgThumbnail from "lightgallery/plugins/thumbnail"
import lgZoom from "lightgallery/plugins/zoom"
import lgRotate from "lightgallery/plugins/rotate"
import lgAutoplay from "lightgallery/plugins/autoplay"
import lgFullscreen from "lightgallery/plugins/fullscreen"
import "lightgallery/css/lightgallery-bundle.css"
import { LightGallery } from "lightgallery/lightgallery"

interface PreviewProps {
  images?: Obj[]
  navigate?: (name: string) => void
  gallery_props?: {
    thumbnail?: boolean
    preload?: number
  }
}

const Preview = (props: PreviewProps) => {
  const t = useT()
  const { replace } = useRouter()
  const { rawLink } = useLink()
  let dynamicGallery: LightGallery | undefined
  let isGalleryOpen = false
  let images =
    props.images || objStore.objs.filter((obj) => obj.type === ObjType.IMAGE)
  if (images.length === 0) {
    images = [objStore.obj]
  }

  const navigateTo = (name: string) => {
    if (props.navigate) {
      props.navigate(name)
    } else {
      replace(name)
    }
  }

  const prev = () => {
    const index = images.findIndex((f) => f.name === objStore.obj.name)
    if (index > 0) {
      navigateTo(images[index - 1].name)
    }
  }

  const next = () => {
    const index = images.findIndex((f) => f.name === objStore.obj.name)
    if (index < images.length - 1) {
      navigateTo(images[index + 1].name)
    }
  }

  const onKeydown = (e: KeyboardEvent) => {
    if (isGalleryOpen) return
    if (e.key === "ArrowLeft") {
      prev()
    } else if (e.key === "ArrowRight") {
      next()
    }
  }
  const openGallery = () => {
    const el = document.createElement("div")
    dynamicGallery = lightGallery(el, {
      dynamic: true,
      controls: true,
      thumbnail: props.gallery_props?.thumbnail ?? true,
      preload: props.gallery_props?.preload ?? 2,
      dynamicEl: images.map((obj) => {
        return {
          src: rawLink(obj),
          thumb: rawLink(obj),
          subHtml: `<h4>${obj.name}</h4>`,
        }
      }),
      plugins: [lgZoom, lgThumbnail, lgRotate, lgFullscreen, lgAutoplay],
    })
    let galleryIndex = images.findIndex((obj) => obj.name === objStore.obj.name)
    el.addEventListener("lgAfterSlide", (e: any) => {
      galleryIndex = e.detail.index
    })
    el.addEventListener("lgAfterClose", () => {
      isGalleryOpen = false
      if (galleryIndex >= 0 && galleryIndex < images.length) {
        const name = images[galleryIndex].name
        if (name !== objStore.obj.name) {
          navigateTo(name)
        }
      }
    })
    isGalleryOpen = true
    dynamicGallery.openGallery(galleryIndex)
  }

  onMount(() => {
    window.addEventListener("keydown", onKeydown)
  })
  onCleanup(() => {
    window.removeEventListener("keydown", onKeydown)
    if (dynamicGallery) {
      dynamicGallery.destroy()
    }
  })
  return (
    <ImageWithError
      maxH="75vh"
      rounded="$lg"
      src={objStore.raw_url}
      fallback={<FullLoading />}
      fallbackErr={<Error msg={t("home.preview.failed_load_img")} />}
      onClick={openGallery}
      cursor="pointer"
    />
  )
}

export default Preview
