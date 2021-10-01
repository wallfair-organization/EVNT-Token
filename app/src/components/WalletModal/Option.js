export default function Option({
  link = null,
  clickable = true,
  size,
  onClick = null,
  color,
  header,
  subheader = null,
  icon,
  active = false,
  id,
}) {
  return (
    <div className="OptionWrap" id={id} onClick={onClick} clickable={clickable && !active} active={active}>
      <span>{header}</span>
    </div>
  );
}
