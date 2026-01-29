import React from "react";
import "./NewChip.css";
import PropTypes from "prop-types";

const NewChip = ({
  label,
  variant ,
  size = "md",
  shape="pill",
  avatar,
  icon,
  onClick,
  className = "",
  ariaLabel,
}) => {
  const Component = onClick && typeof(onClick)==="function" ? "button" : "div";

  return (
    <Component
      className={`
        newchip
        chip-${variant}
        chip-${size}
        chip-shape-${shape}

        ${className}
      `}
      onClick={typeof(onClick)==="function" ? onClick : undefined}
      aria-label={ariaLabel || label}
    >
      {avatar && (
        <span className="chip-avatar" aria-hidden="true">
          {avatar}
        </span>
      )}

      {icon && (
        <span className="chip-icon" aria-hidden="true">
          {icon}
        </span>
      )}

      <span className="">{label}</span>
    </Component>
  );
};

NewChip.propTypes = {
  label: PropTypes.string.isRequired,
  variant: [
    "info",
    "highlight",
    "error",
    "light",
    "dark",
    "success",
    "warning",
    "highlight2"
  ],
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  shape: PropTypes.oneOf([ "standard", "pill"]),
  avatar: PropTypes.node,
  icon: PropTypes.node,

  onClick: PropTypes.func,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default NewChip;
