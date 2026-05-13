-- Convites de administrador: metadata invited_as_admin no user_metadata → insere em app_admins
-- (idempotente com ON CONFLICT; compatível com handle_new_user em vendors)

CREATE OR REPLACE FUNCTION public.handle_invited_admin_app_admins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'invited_as_admin', '') = 'true' THEN
    INSERT INTO public.app_admins (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_promote_invited_admin ON auth.users;
CREATE TRIGGER on_auth_user_promote_invited_admin
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invited_admin_app_admins();
