import { Icon } from '../Icon';
import { money } from '../../lib/utils';
import type { Product, Page } from '../../types';

interface ChatProductProps {
  product: Product;
  onNavigate: (page: Page, product?: Product) => void;
}

export function ChatProduct({ product, onNavigate }: ChatProductProps) {
  return (
    <button
      className="chat-product"
      onClick={() => onNavigate('product', product)}
    >
      <img src={product.images?.[0] || ''} alt="" />

      <span>
        <small>Conversation about</small>
        <strong>{product.name}</strong>
        <b>
          {money(product.price)} · {product.condition}
        </b>
      </span>

      <Icon name="chevron" />
    </button>
  );
}
