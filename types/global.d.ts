// types/global.d.ts

import * as React from "react";

/**
 * styled-jsx の <style jsx> 用に
 * React の StyleHTMLAttributes を拡張
 */
declare module "react" {
  interface StyleHTMLAttributes<T> extends React.HTMLAttributes<T> {
    /** `<style jsx>` を許可 */
    jsx?: boolean;
    /** `<style jsx global>` を許可 */
    global?: boolean;
  }
}